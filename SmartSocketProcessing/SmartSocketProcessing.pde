public class PostThread implements Runnable {
     public PostThread() {
          this.volts = null;
          this.numSent = 0;
          this.modulo = 100;
          
          this.post = new PostRequest("http://sockettoyou.herokuapp.com/api/multi");
     }
  
     public void run() {
         println("Post thread: running!");
     }
     
     /**
      * Tries to update the newest value of volts and send a POST request with the updated data.
      * This won't happen if the thread is already sending data, as that would spam the server
      * and slow the thread down. 
      */
     public void getData(float[] volts) {
         if (this.volts != null) {
             return;
         }
         
         this.volts = volts;
         this.sendData();
     }
     
     /**
      * Private meaty function to POST the most recent volts measurement to the server.
      * The Post member variable already has user set from the constructor, so it just
      * needs the volts from here.
      */
     private void sendData() {
         String argument = "";
         int i;
         
         for (i = 0; i < 6; i += 1) {
             argument += Float.toString(this.volts[i]) + ",";
         }
         
         // Only send every very measurement, since there are just so darn many.
         this.numSent += 1;
         if (this.numSent % this.modulo == 0) {
             this.post.addData("user", "1");
             this.post.addData("volts", argument);
             this.post.send();
         
             println("Sent #" + Integer.toString(this.numSent / this.modulo) + ": " + argument);
         }
         
         // Once the request is sent, setting volts to null will allow getData to trigger
         this.volts = null;
     }
     
     // The most recent (unsent) voltage measurements. Whenever this isn't null, 
     // this.sendData should post them to the server.
     private float[] volts;
     
     // A counter of how many posts have been sent to the server.
     private int numSent;
     
     // How often a measurement should actually be sent out (to reduce spam).
     private int modulo;
     
     // The driving object used to post requests. Each sendData call, it gets the user
     // and voltage, and posts them.
     private PostRequest post;
}

// Threads to continuously post new data to the server
PostThread running = new PostThread();
Thread thread = new Thread(running);

// Screen size (height and width, respectively)
int ssizeh = 750;
int ssizew = 500;

// Array to store the heat values for each pixel
float heatmap[][][] = new float[2][ssizew][ssizeh];

// The index of the current heatmap
int index = 0;

// A color gradient to see pretty colors
Gradient g;
import processing.serial.*;

// HTTP library for easier requests
// To install this, go to Sketch > Import Library > Custom... and find "HTTP Requests for Processing"
import http.requests.*;

// The serial port
Serial myPort; 

float A0 = 0;
float A1 = 0; 
float A2 = 0;
float A3 = 0;
float A4 = 0;
float A5 = 0;
color CA0;
color CA1;
color CA2;
color CA3;
color CA4;
color CA5;
float PxA0 = 0;
float PxA1 = 0; 
float PxA2 = 0;
float PxA3 = 0;
float PxA4 = 0;
float PxA5 = 0;
float PyA0 = 0;
float PyA1 = 0; 
float PyA2 = 0;
float PyA3 = 0;
float PyA4 = 0;
float PyA5 = 0;

void setup() {
    size(ssizew, ssizeh);
    println(Serial.list());
    // Open whatever port is the one you're using.
    myPort = new Serial(this, Serial.list()[1], 9600);
    // don't generate a serialEvent() unless you get a newline character:
    myPort.bufferUntil('\n');
    // set inital background:
    background(0);
    g = new Gradient();
    
    g.addColor(#000000);
    g.addColor(#0000FF);
    g.addColor(#0010FF);
    g.addColor(#0020FF);
    g.addColor(#0030FF);
    g.addColor(#0040FF);
    g.addColor(#0050FF);
    g.addColor(#0061FF);
    g.addColor(#0071FF);
    g.addColor(#0081FF);
    g.addColor(#0091FF);
    g.addColor(#00A1FF);
    g.addColor(#00B2FF);
    g.addColor(#00C2FF);
    g.addColor(#00D2FF);
    g.addColor(#00E2FF);
    g.addColor(#00F2FF);
    g.addColor(#00FFFA);
    g.addColor(#00FFDA);
    g.addColor(#00FFCA);
    g.addColor(#00FFBA);
    g.addColor(#00FFA9);
    g.addColor(#00FF99);
    g.addColor(#00FF89);
    g.addColor(#00FF79);
    g.addColor(#00FF69);
    g.addColor(#00FF59);
    g.addColor(#00FF48);
    g.addColor(#00FF38);
    g.addColor(#00FF28);
    g.addColor(#00FF18);
    g.addColor(#00FF08);
    g.addColor(#08FF00);
    g.addColor(#18FF00);
    g.addColor(#28FF00);
    g.addColor(#38FF00);
    g.addColor(#48FF00);
    g.addColor(#59FF00);
    g.addColor(#69FF00);
    g.addColor(#79FF00);
    g.addColor(#89FF00);
    g.addColor(#99FF00);
    g.addColor(#AAFF00);
    g.addColor(#BAFF00);
    g.addColor(#CAFF00);
    g.addColor(#DAFF00);
    g.addColor(#EAFF00);
    g.addColor(#FAFF00);
    g.addColor(#FFE200);
    g.addColor(#FFD200);
    g.addColor(#FFC200);
    g.addColor(#FFB200);
    g.addColor(#FFA100);
    g.addColor(#FF9100);
    g.addColor(#FF8100);
    g.addColor(#FF7100);
    g.addColor(#FF6100);
    g.addColor(#FF5000);
    g.addColor(#FF4000);
    g.addColor(#FF3000);
    g.addColor(#FF2000);
    g.addColor(#FF1000);
    g.addColor(#FF0000);
    
    // Initalize the heat map (make sure everything is 0.0)
    for (int i = 0; i < ssizew; ++i) {
        for (int j = 0; j < ssizeh; ++j) {
            heatmap[index][i][j] = 0.0;
        }
    }
    
    // Start the thread
    thread.start();
    
}

void serialEvent (Serial myPort) {
    // get the ASCII string:
    String inString = myPort.readStringUntil('\n');
    if (inString == null) {
        return;
    }
    
    // trim off any whitespace:
    inString = trim(inString);
    // convert to an int and map to the screen height:
    float inByte = float(inString);
    if (inByte > 5119 && inByte < 6144) {
        A5 = inByte-5120; 
    }
    if (inByte > 4095 && inByte < 5120) {
        A4 = inByte-4096; 
    }
    if (inByte > 3071 && inByte < 4096) {
        A3 = inByte-3072; 
    }
    if (inByte > 2047 && inByte < 3072) {
        A2 = inByte-2048; 
    }
    if (inByte > 1023 && inByte < 2048) {
        A1 = inByte-1024; 
    }
    if (inByte < 1024) {
        A0 = inByte;
    }

    A5 = map(A5, 0, 1023, 0, height);
    A4 = map(A4, 0, 1023, 0, height);
    A3 = map(A3, 0, 1023, 0, height);
    A2 = map(A2, 0, 1023, 0, height);
    A1 = map(A1, 0, 1023, 0, height);
    A0 = map(A0, 0, 1023, 0, height);
     
    float x = 50;
    float y = 50;
    //Color
    int norm = 16;
    CA0 = g.getGradient(A0/norm);
    CA1 = g.getGradient(A1/norm);
    CA2 = g.getGradient(A2/norm);
    CA3 = g.getGradient(A3/norm);
    CA4 = g.getGradient(A4/norm);
    CA5 = g.getGradient(A5/norm);
    //Position
    PxA0 = width/2;
    PxA1 = 2*width/3;
    PxA2 = width/3;
    PxA3 = width/2;
    PxA4 = width/2;
    PxA5 = width/2;
    PyA0 = height/6;
    PyA1 = height/4;
    PyA2 = height/4;
    PyA3 = height/2;
    PyA4 = height*3/4;
    PyA5 = height*5/6;
    //draw circles
    noStroke();
    ellipseMode(CENTER);
    fill(CA0);
    ellipse(PxA0, PyA0, x, y);
    fill(CA1);
    ellipse(PxA1, PyA1, x, y);
    fill(CA2);
    ellipse(PxA2, PyA2, x, y);
    fill(CA3);
    ellipse(PxA3, PyA3, x, y);
    fill(CA4);
    ellipse(PxA4, PyA4, x, y);
    fill(CA5);
    ellipse(PxA5, PyA5, x, y);
        
    // Josh's code - sending to the server
    float[] volts = { A0, A1, A2, A3, A4, A5 };
    running.getData(volts);
}

void draw() {
    //See if heat (or cold) needs applied
    if (mousePressed && (mouseButton == LEFT)) {
        apply_heat(mouseX, mouseY, 15, .5);
    }
    if (mousePressed && (mouseButton == RIGHT)) {
        apply_heat(mouseX, mouseY, 15, -.25);
    }
}

void apply_heat(int i, int j, int r, float delta) {
    // apply delta heat (or remove it) at location 
    // (i, j) with radius r
    float deltan = 0;
    for (int x = - (r /2); x < (r/2); ++x)
    {
        for (int y = - (r /2); y < (r/2); ++y)
        {
            if (i + x < 0 || i + x >= width || j + y < 0 || j + y >= height) {
                continue;
            }

            // apply the heatR
            deltan = 1/(sqrt(sq(x)+sq(y))/(r/2))*delta;            
            heatmap[index][i + x][j + y] += deltan;
            heatmap[index][i + x][j + y] = constrain(heatmap[index][i + x][j + y], 0.0, 200.0);
        }
    }
}

